// In a real app, this would be fetched from an API or file upload.
// Embedding the provided XML data here for immediate functionality.

export const CLINICAL_CONCEPTS = [
  "Partial Range of Field-Narrow",
  "Partial Range of Field-Enhance",
  "Partial Range of Field-Extend",
  "Full Range of Field-Steep",
  "Full Range of Field-Smooth",
  "Full Range of Field-Continuous"
];

export const LVC_OPTIONS = {
  'any': 'N/A',
  'lvc_hiper_mayor_4': 'Hipermetrópico >= 4D',
  'lvc_hiper_menor_4': 'Hipermetrópico < 4D',
  'lvc_miopico_2_4': 'Miópico (-2 a -4D)',
  'lvc_miopico_5_7': 'Miópico (-5 a -7D)',
  'lvc_miopico_8_10': 'Miópico (-8 a -10D)',
  'kr': 'KR'
};

export const UDVA_OPTIONS = { 
  'any': 'N/A', 
  'udva_menor_07': '< 0.7' 
};

export const CONTACT_LENS_OPTIONS = { 
  'any': 'N/A', 
  'no_usa_lc': 'No Usa LC', 
  'apenas_tolera_lc': 'Apenas Tolera LC', 
  'tolera_lc': 'Tolera LC' 
};

export const ANTERIOR_CHAMBER_OPTIONS = { 
  'any': 'N/A', 
  'camara_estrecha': 'Estrecha', 
  'camara_normal': 'Normal' 
};

export const RETINA_OPTIONS = {
  'any': 'N/A',
  'con_estafiloma': 'Con Estafiloma',
  'sin_estafiloma': 'Sin Estafiloma',
  'vitrectomia': 'Vitrectomia'
};


export const IOL_XML_DATA = `<?xml version="1.0" encoding="UTF-8" ?>
<IOLCon fileVersion="2.0" downloaded="2025-11-27">
	<Lens id="2299">
		<Manufacturer>1stQ</Manufacturer>
		<Name>611HPS</Name>
		<Specifications>
			<SinglePiece>yes</SinglePiece>
			<OpticMaterial>hydrophilic acrylic</OpticMaterial>
			<HapticMaterial>hydrophilic acrylic</HapticMaterial>
			<Preloaded>no</Preloaded>
			<Foldable>yes</Foldable>
			<IncisionWidth>2.2</IncisionWidth>
			<InjectorSize></InjectorSize>
			<Hydro>hydrophilic</Hydro>
			<Filter>UV</Filter>
			<RefractiveIndex>1.46</RefractiveIndex>
			<AbbeNumber>58</AbbeNumber>
			<Achromatic>no</Achromatic>
			<OpticDiameter>6.0</OpticDiameter>
			<HapticDiameter>12.5</HapticDiameter>
			<OpticConcept>monofocal</OpticConcept>
			<HapticDesign>C loop 9° angled</HapticDesign>
			<IntendedLocation>capsular bag</IntendedLocation>
			<OpticDesign>spherical</OpticDesign>
			<Aberration>positive</Aberration>
			<saCorrection>0.18</saCorrection>
			<Toric>no</Toric>
		</Specifications>
		<Availability>
			<Sphere range="1">
				<From>0</From>
				<To>9</To>
				<Increment>1</Increment>
			</Sphere>
			<Sphere range="2">
				<From>10</From>
				<To>30</To>
				<Increment>0.5</Increment>
			</Sphere>
		</Availability>
		<Constants type="nominal">
			<Ultrasound>118.9</Ultrasound>
			<SRKt>118.5</SRKt>
            <pACD>5.20</pACD>
            <sf>1.45</sf>
            <Haigis_a0>1.05</Haigis_a0>
            <Haigis_a1>0.40</Haigis_a1>
            <Haigis_a2>0.10</Haigis_a2>
		</Constants>
        <Constants type="optimized">
			<Ultrasound>119.2</Ultrasound>
			<SRKt>118.8</SRKt>
            <pACD>5.52</pACD>
            <sf>1.72</sf>
             <Haigis_a0>1.33</Haigis_a0>
            <Haigis_a1>0.40</Haigis_a1>
            <Haigis_a2>0.10</Haigis_a2>
		</Constants>
	</Lens>
	<Lens id="2306">
		<Manufacturer>1stQ</Manufacturer>
		<Name>A4DW0K</Name>
		<Specifications>
			<SinglePiece>yes</SinglePiece>
			<OpticMaterial>hydrophilic acrylic</OpticMaterial>
			<HapticMaterial>hydrophilic acrylic</HapticMaterial>
			<Preloaded>no</Preloaded>
			<Foldable>yes</Foldable>
			<IncisionWidth>2.4</IncisionWidth>
			<InjectorSize></InjectorSize>
			<Hydro>hydrophilic</Hydro>
			<Filter>UV</Filter>
			<RefractiveIndex>1.46</RefractiveIndex>
			<AbbeNumber>58</AbbeNumber>
			<Achromatic>no</Achromatic>
			<OpticDiameter>6.0</OpticDiameter>
			<HapticDiameter>13.0</HapticDiameter>
			<OpticConcept>multifocal</OpticConcept>
			<HapticDesign>4 loops Square</HapticDesign>
			<IntendedLocation>sulcus ciliaris</IntendedLocation>
			<OpticDesign>aspheric</OpticDesign>
			<Aberration>neutral</Aberration>
			<saCorrection>0.00</saCorrection>
			<Toric>no</Toric>
		</Specifications>
		<Availability>
			<Sphere range="1">
				<From>0</From>
				<To>30</To>
				<Increment>0.5</Increment>
			</Sphere>
			<Addition distance="near">3.0</Addition>
            <Addition distance="intermediate">1.5</Addition>
		</Availability>
        <Constants type="nominal">
			<Ultrasound>118.0</Ultrasound>
			<SRKt>118.2</SRKt>
		</Constants>
	</Lens>
    <Lens id="2301">
		<Manufacturer>1stQ</Manufacturer>
		<Name>B1AB00</Name>
		<Specifications>
			<SinglePiece>yes</SinglePiece>
			<OpticMaterial>hydrophobic acrylic</OpticMaterial>
			<HapticMaterial>hydrophobic acrylic</HapticMaterial>
			<Preloaded>yes</Preloaded>
			<Foldable>yes</Foldable>
			<IncisionWidth>2.2</IncisionWidth>
			<InjectorSize>2.2</InjectorSize>
			<Hydro>hydrophobic</Hydro>
			<Filter>UV</Filter>
			<RefractiveIndex>1.47</RefractiveIndex>
			<AbbeNumber>58</AbbeNumber>
			<Achromatic>no</Achromatic>
			<OpticDiameter>6.0</OpticDiameter>
			<HapticDiameter>13.0</HapticDiameter>
			<OpticConcept>monofocal</OpticConcept>
			<HapticDesign>C-loop</HapticDesign>
			<IntendedLocation>capsular bag</IntendedLocation>
			<OpticDesign>aspheric</OpticDesign>
			<Aberration>neutral</Aberration>
			<saCorrection>0.00</saCorrection>
			<Toric>no</Toric>
		</Specifications>
		<Availability>
			<Sphere range="2">
				<From>-10</From>
				<To>9</To>
				<Increment>1</Increment>
			</Sphere>
			<Sphere range="3">
				<From>10</From>
				<To>30</To>
				<Increment>0.5</Increment>
			</Sphere>
			<Sphere range="4">
				<From>31</From>
				<To>35</To>
				<Increment>1</Increment>
			</Sphere>
		</Availability>
        <Constants type="nominal">
			<Ultrasound>118.9</Ultrasound>
            <SRKt>119.1</SRKt>
             <Haigis_a0>1.45</Haigis_a0>
            <Haigis_a1>0.40</Haigis_a1>
            <Haigis_a2>0.10</Haigis_a2>
        </Constants>
	</Lens>
    <Lens id="1157">
		<Manufacturer>Alcon</Manufacturer>
		<Name>AcrySof IQ Vivity DFT015</Name>
		<Specifications>
			<SinglePiece>yes</SinglePiece>
			<OpticMaterial>hydrophobic acrylic</OpticMaterial>
			<HapticMaterial>hydrophobic acrylic</HapticMaterial>
			<Preloaded>no</Preloaded>
			<Foldable>yes</Foldable>
			<IncisionWidth>2.2</IncisionWidth>
			<InjectorSize>2.2</InjectorSize>
			<Hydro>hydrophobic</Hydro>
			<Filter>yellow</Filter>
			<RefractiveIndex>1.55</RefractiveIndex>
			<AbbeNumber>37</AbbeNumber>
			<Achromatic>no</Achromatic>
			<OpticDiameter>6.0</OpticDiameter>
			<HapticDiameter>13.0</HapticDiameter>
			<OpticConcept>EDoF</OpticConcept>
			<HapticDesign>STABLEFORCE</HapticDesign>
			<IntendedLocation>capsular bag</IntendedLocation>
			<OpticDesign>aspheric</OpticDesign>
			<Aberration>correcting</Aberration>
			<saCorrection>-0.20</saCorrection>
			<Toric>no</Toric>
		</Specifications>
		<Availability>
			<Sphere range="1">
				<From>10</From>
				<To>30</To>
				<Increment>0.5</Increment>
			</Sphere>
		</Availability>
        <Constants type="nominal">
			<Ultrasound>118.7</Ultrasound>
            <SRKt>118.7</SRKt>
            <pACD>5.35</pACD>
            <sf>1.56</sf>
            <Haigis_a0>1.25</Haigis_a0>
            <Haigis_a1>0.40</Haigis_a1>
            <Haigis_a2>0.10</Haigis_a2>
        </Constants>
        <Constants type="optimized">
			<Ultrasound>119.2</Ultrasound>
            <SRKt>119.1</SRKt>
             <Haigis_a0>1.51</Haigis_a0>
            <Haigis_a1>0.40</Haigis_a1>
            <Haigis_a2>0.10</Haigis_a2>
        </Constants>
	</Lens>
    <Lens id="1836">
		<Manufacturer>Alcon</Manufacturer>
		<Name>Clareon PanOptix Toric CNWTT2-6</Name>
		<Specifications>
			<SinglePiece>yes</SinglePiece>
			<OpticMaterial>hydrophobic acrylic</OpticMaterial>
			<HapticMaterial>hydrophobic acrylic</HapticMaterial>
			<Preloaded>yes</Preloaded>
			<Foldable>yes</Foldable>
			<IncisionWidth>2.2</IncisionWidth>
			<InjectorSize>2.2</InjectorSize>
			<Hydro>hydrophobic</Hydro>
			<Filter>yellow</Filter>
			<RefractiveIndex>1.55</RefractiveIndex>
			<AbbeNumber>37</AbbeNumber>
			<Achromatic>no</Achromatic>
			<OpticDiameter>6.0</OpticDiameter>
			<HapticDiameter>13.0</HapticDiameter>
			<OpticConcept>multifocal</OpticConcept>
			<HapticDesign>STABLEFORCE</HapticDesign>
			<IntendedLocation>capsular bag</IntendedLocation>
			<OpticDesign>aspheric</OpticDesign>
			<Aberration>correcting</Aberration>
			<saCorrection>-0.10</saCorrection>
			<Toric>yes</Toric>
		</Specifications>
		<Availability refractivePower="spherical equivalent" tNotation="yes">
			<Sphere range="1">
				<From>6</From>
				<To>30</To>
				<Increment>0.5</Increment>
			</Sphere>
			<Sphere range="2">
				<From>31</From>
				<To>34</To>
				<Increment>1</Increment>
			</Sphere>
            <Addition distance="near">3.25</Addition>
            <Addition distance="intermediate">2.17</Addition>
		</Availability>
         <Constants type="nominal">
			<Ultrasound>119.1</Ultrasound>
            <SRKt>119.1</SRKt>
        </Constants>
	</Lens>
    <Lens id="985">
		<Manufacturer>ZEISS</Manufacturer>
		<Name>AT LISA tri 839MP</Name>
		<Specifications>
			<SinglePiece>yes</SinglePiece>
			<OpticMaterial>hydrophilic acrylic</OpticMaterial>
			<HapticMaterial>hydrophilic acrylic</HapticMaterial>
			<Preloaded>yes</Preloaded>
			<Foldable>yes</Foldable>
			<IncisionWidth>1.8</IncisionWidth>
			<InjectorSize>1.8</InjectorSize>
			<Hydro>hydrophilic</Hydro>
			<Filter>UV</Filter>
			<RefractiveIndex>1.46</RefractiveIndex>
			<AbbeNumber>58</AbbeNumber>
			<Achromatic>no</Achromatic>
			<OpticDiameter>6.0</OpticDiameter>
			<HapticDiameter>11.0</HapticDiameter>
			<OpticConcept>multifocal</OpticConcept>
			<HapticDesign>4-haptic, MICS</HapticDesign>
			<IntendedLocation>capsular bag</IntendedLocation>
			<OpticDesign>aspheric</OpticDesign>
			<Aberration>correcting</Aberration>
			<saCorrection>-0.18</saCorrection>
			<Toric>no</Toric>
		</Specifications>
		<Availability>
			<Sphere range="1">
				<From>0</From>
				<To>32</To>
				<Increment>0.5</Increment>
			</Sphere>
             <Addition distance="near">3.33</Addition>
            <Addition distance="intermediate">1.66</Addition>
		</Availability>
        <Constants type="nominal">
			<Ultrasound>118.6</Ultrasound>
            <SRKt>118.3</SRKt>
             <Haigis_a0>1.60</Haigis_a0>
            <Haigis_a1>0.40</Haigis_a1>
            <Haigis_a2>0.10</Haigis_a2>
        </Constants>
	</Lens>
    <Lens id="824">
		<Manufacturer>Biotech Vision Care</Manufacturer>
		<Name>EYECRYL ACTV</Name>
		<Specifications>
			<SinglePiece>yes</SinglePiece>
			<OpticMaterial>hydrophobic acrylic</OpticMaterial>
			<HapticMaterial>hydrophobic acrylic</HapticMaterial>
			<Preloaded>no</Preloaded>
			<Foldable>yes</Foldable>
			<IncisionWidth>2.2</IncisionWidth>
			<InjectorSize>2.2</InjectorSize>
			<Hydro>hydrophobic</Hydro>
			<Filter>yellow</Filter>
			<RefractiveIndex>1.48</RefractiveIndex>
			<AbbeNumber>49</AbbeNumber>
			<Achromatic>yes</Achromatic>
			<OpticDiameter>6.0</OpticDiameter>
			<HapticDiameter>13.0</HapticDiameter>
			<OpticConcept>multifocal</OpticConcept>
			<HapticDesign>C loop</HapticDesign>
			<IntendedLocation>capsular bag</IntendedLocation>
			<OpticDesign>aspheric</OpticDesign>
			<Aberration>correcting</Aberration>
			<saCorrection>-0.20</saCorrection>
			<Toric>no</Toric>
		</Specifications>
		<Availability>
			<Sphere range="1">
				<From>7.5</From>
				<To>30</To>
				<Increment>0.5</Increment>
			</Sphere>
			<Addition distance="near">3.0</Addition>
		</Availability>
         <Constants type="nominal">
			<Ultrasound>118.5</Ultrasound>
            <SRKt>118.8</SRKt>
        </Constants>
	</Lens>
</IOLCon>`;
