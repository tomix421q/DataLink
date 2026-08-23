import skFlag from './../assets/sk-flag.svg'
import ukFlag from './../assets/uk-flag.svg'
import enFlag from './../assets/en-flag.svg'

type Props = {
  show: boolean
  selectedLang: 'EN' | 'UK' | 'SK' | null
  setSelectedLang: (l: 'EN' | 'UK' | 'SK') => void
}

export default function LangSelector({ show, selectedLang, setSelectedLang }: Props) {
  if (!show) return null

  return (
    <div className='langGrid'>
      <button className={`cardBtn smallCard ${selectedLang === 'SK' ? 'active' : ''}`} onClick={() => setSelectedLang('SK')}>
        <img src={skFlag} alt='sk flag' width={36} /> SK
      </button>

      <button className={`cardBtn smallCard ${selectedLang === 'UK' ? 'active' : ''}`} onClick={() => setSelectedLang('UK')}>
        <img src={ukFlag} alt='uk flag' width={36} /> UK
      </button>

      <button className={`cardBtn smallCard ${selectedLang === 'EN' ? 'active' : ''}`} onClick={() => setSelectedLang('EN')}>
        <img src={enFlag} alt='en flag' width={36} /> EN
      </button>
    </div>
  )
}
